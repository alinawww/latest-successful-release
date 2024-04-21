import { Octokit } from '@octokit/rest'

import { getLatestWorkflow, releaseWorkflowPath } from './get-latest-workflow'
// import { workflowRunFactory } from 'src/test-factory/workflow-run-factory'

const mockGetWorkflowRuns = jest.fn()

jest.mock('@octokit/rest', () => ({
  Octokit: class {
    rest = {
      actions: { listWorkflowRunsForRepo: mockGetWorkflowRuns }
    }
  }
}))

const client = new Octokit({ auth: 'token' })

describe('get latest workflow', () => {
  beforeEach(jest.clearAllMocks)

  it('should return failures', async () => {
    mockGetWorkflowRuns.mockResolvedValue({
      data: {
        workflow_runs: [
          {
            run_number: 1,
            path: releaseWorkflowPath,
            conclusion: 'failure',
            status: 'completed'
          }
        ]
      }
    })

    const latestRelease = await getLatestWorkflow(
      client,
      { sha: 'sha' },
      'owner',
      'repo'
    )

    expect(latestRelease).toMatchObject({ conclusion: 'failure' })
  })

  it('should sort workflow runs by run number', async () => {
    mockGetWorkflowRuns.mockResolvedValue({
      data: {
        workflow_runs: [
          {
            run_number: 1,
            path: releaseWorkflowPath,
            conclusion: 'failure',
            status: 'completed'
          },
          {
            run_number: 2,
            path: releaseWorkflowPath,
            conclusion: 'success',
            status: 'completed'
          }
        ]
      }
    })

    const latestRelease = await getLatestWorkflow(
      client,
      { sha: 'sha' },
      'owner',
      'repo'
    )

    expect(latestRelease).toMatchObject({ runNumber: 2 })
  })

  it('should return null when workflow is not found', async () => {
    mockGetWorkflowRuns.mockResolvedValue({
      data: {
        workflow_runs: []
      }
    })

    const latestRelease = await getLatestWorkflow(
      client,
      { sha: 'sha' },
      'owner',
      'repo'
    )

    expect(latestRelease).toBeNull()
  })
})
