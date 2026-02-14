/**
 * Vercel API Helpers
 * Para gerenciar variáveis de ambiente do projeto Vercel
 */

interface VercelEnvVariable {
  id?: string;
  key: string;
  value: string;
  type: 'encrypted' | 'plain' | 'secret' | 'system';
  target: ('production' | 'preview' | 'development')[];
  gitBranch?: string;
}

interface CreateEnvOptions {
  token: string;
  projectId: string;
  teamId?: string;
  key: string;
  value: string;
  target?: ('production' | 'preview' | 'development')[];
  type?: 'encrypted' | 'plain';
}

interface UpdateEnvOptions extends CreateEnvOptions {
  envId: string;
}

/**
 * Lista todas as variáveis de ambiente de um projeto
 */
export async function listEnvironmentVariables(
  token: string,
  projectId: string,
  teamId?: string
): Promise<{ envs: VercelEnvVariable[]; error?: string }> {
  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/env`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { envs: [], error: `Vercel API error: ${response.status} - ${error}` };
    }

    const data = await response.json();
    return { envs: data.envs || [] };
  } catch (error: any) {
    return { envs: [], error: error.message || 'Unknown error' };
  }
}

/**
 * Cria uma nova variável de ambiente
 */
export async function createEnvironmentVariable(
  options: CreateEnvOptions
): Promise<{ success: boolean; env?: VercelEnvVariable; error?: string }> {
  const { token, projectId, teamId, key, value, target, type } = options;

  try {
    const url = teamId
      ? `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
      : `https://api.vercel.com/v10/projects/${projectId}/env`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value,
        type: type || 'encrypted',
        target: target || ['production', 'preview', 'development'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Vercel API error: ${response.status} - ${error}` };
    }

    const env = await response.json();
    return { success: true, env };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Atualiza uma variável de ambiente existente
 */
export async function updateEnvironmentVariable(
  options: UpdateEnvOptions
): Promise<{ success: boolean; env?: VercelEnvVariable; error?: string }> {
  const { token, projectId, teamId, envId, key, value, target, type } = options;

  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/env/${envId}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/env/${envId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value,
        type: type || 'encrypted',
        target: target || ['production', 'preview', 'development'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Vercel API error: ${response.status} - ${error}` };
    }

    const env = await response.json();
    return { success: true, env };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Remove uma variável de ambiente
 */
export async function deleteEnvironmentVariable(
  token: string,
  projectId: string,
  envId: string,
  teamId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/env/${envId}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/env/${envId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Vercel API error: ${response.status} - ${error}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Upsert de uma variável de ambiente (cria se não existir, atualiza se existir)
 */
export async function upsertEnvironmentVariable(
  options: CreateEnvOptions
): Promise<{ success: boolean; env?: VercelEnvVariable; error?: string }> {
  const { token, projectId, teamId, key } = options;

  // Primeiro, tentar listar para ver se a variável já existe
  const { envs, error: listError } = await listEnvironmentVariables(token, projectId, teamId);

  if (listError) {
    return { success: false, error: listError };
  }

  const existingEnv = envs.find(env => env.key === key);

  if (existingEnv && existingEnv.id) {
    // Atualizar existente
    return await updateEnvironmentVariable({
      ...options,
      envId: existingEnv.id,
    });
  } else {
    // Criar nova
    return await createEnvironmentVariable(options);
  }
}

/**
 * Aplica múltiplas variáveis de ambiente de uma vez (batch upsert)
 */
export async function applyEnvironmentVariables(
  token: string,
  projectId: string,
  variables: { key: string; value: string }[],
  teamId?: string,
  target?: ('production' | 'preview' | 'development')[]
): Promise<{ success: boolean; results: { key: string; success: boolean; error?: string }[] }> {
  const results: { key: string; success: boolean; error?: string }[] = [];

  for (const variable of variables) {
    const result = await upsertEnvironmentVariable({
      token,
      projectId,
      teamId,
      key: variable.key,
      value: variable.value,
      target,
    });

    results.push({
      key: variable.key,
      success: result.success,
      error: result.error,
    });
  }

  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, results };
}
