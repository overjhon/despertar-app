/**
 * GitHub Actions API Helpers
 * Para disparar workflows e monitorar execuções
 */

interface WorkflowDispatchInput {
  owner: string;
  repo: string;
  workflow_id: string;
  ref: string;
  inputs?: Record<string, string>;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

/**
 * Dispara um workflow do GitHub Actions
 */
export async function dispatchWorkflow(
  token: string,
  params: WorkflowDispatchInput
): Promise<{ success: boolean; error?: string }> {
  const { owner, repo, workflow_id, ref, inputs } = params;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref, inputs: inputs || {} }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `GitHub API error: ${response.status} - ${error}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Lista as execuções recentes de um workflow
 */
export async function listRecentRuns(
  token: string,
  owner: string,
  repo: string,
  workflow_id: string,
  limit: number = 10
): Promise<{ runs: WorkflowRun[]; error?: string }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/runs?per_page=${limit}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { runs: [], error: `GitHub API error: ${response.status} - ${error}` };
    }

    const data = await response.json();
    return { runs: data.workflow_runs || [] };
  } catch (error: any) {
    return { runs: [], error: error.message || 'Unknown error' };
  }
}

/**
 * Aguarda a conclusão da execução mais recente de um workflow
 */
export async function waitForLatestRunConclusion(
  token: string,
  owner: string,
  repo: string,
  workflow_id: string,
  timeoutMs: number = 300000, // 5 minutos
  pollIntervalMs: number = 5000 // 5 segundos
): Promise<{ success: boolean; run?: WorkflowRun; error?: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const { runs, error } = await listRecentRuns(token, owner, repo, workflow_id, 1);

    if (error) {
      return { success: false, error };
    }

    if (runs.length === 0) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      continue;
    }

    const latestRun = runs[0];

    if (latestRun.status === 'completed') {
      if (latestRun.conclusion === 'success') {
        return { success: true, run: latestRun };
      } else {
        return { 
          success: false, 
          run: latestRun,
          error: `Workflow completed with conclusion: ${latestRun.conclusion}` 
        };
      }
    }

    // Ainda em execução, aguardar
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  return { success: false, error: 'Timeout waiting for workflow to complete' };
}

/**
 * Obtém o status de uma execução específica
 */
export async function getRunStatus(
  token: string,
  owner: string,
  repo: string,
  run_id: number
): Promise<{ run?: WorkflowRun; error?: string }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run_id}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { error: `GitHub API error: ${response.status} - ${error}` };
    }

    const run = await response.json();
    return { run };
  } catch (error: any) {
    return { error: error.message || 'Unknown error' };
  }
}
