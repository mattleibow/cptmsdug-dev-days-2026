# Batch Command Reference

Execute multiple `ui`/`webview` commands in one repository-local CLI process
via stdin. Output is JSONL, one response per command. Use one process for the
entire interaction sequence: separate sequential CLI processes can retain
different mutation-lease identities and reject each other.

## Usage

Set `$port` to the intended app's freshly discovered port and verify its
identity first. Do not run an Inspector or another action process against
the same app while the batch is active.

### Native counter (PowerShell)

Use a live tree or query to confirm the AutomationIds before running this.
This example assumes the freshly opened counter starts at zero.

```powershell
@'
ui assert Text 0 --automationId CountValue
ui tap --automationId IncrementCount
ui assert Text 1 --automationId CountValue
ui tap --automationId IncrementCount
ui assert Text 2 --automationId CountValue
ui tap --automationId DecrementCount
ui assert Text 1 --automationId CountValue
ui tap --automationId DecrementCount
ui assert Text 0 --automationId CountValue
ui tap --automationId DecrementCount
ui assert Text -1 --automationId CountValue
'@ | dotnet tool run maui -- devflow batch -ap $port --delay 750
```

### Blazor counter (PowerShell)

First confirm `devflow webview status -ap <port>` reports CDP ready.
The affected pinned CLI has broken snapshot, selector, and click helpers;
use direct evaluation instead. DOM reads are allowed, but do not assign
DOM text or component state. `.click()` exercises the actual event handler.

Inspect the DOM with `webview source` before the batch. The example below
assumes a fresh template Home page with an `a[href=counter]` link and the
counter's decrement button, `output`, and increment button in that order.
For another page, derive selectors from its live DOM rather than copying
these selectors blindly.

```powershell
$results = @'
webview Runtime evaluate "document.querySelector('a[href=counter]').click()"
webview Runtime evaluate "document.querySelector('output').textContent === '0' ? 'PASS: 0' : 'FAIL: expected 0'"
webview Runtime evaluate "document.querySelector('output+button').click()"
webview Runtime evaluate "document.querySelector('output').textContent === '1' ? 'PASS: 1' : 'FAIL: expected 1'"
webview Runtime evaluate "document.querySelector('output+button').click()"
webview Runtime evaluate "document.querySelector('output').textContent === '2' ? 'PASS: 2' : 'FAIL: expected 2'"
webview Runtime evaluate "document.querySelector('button.btn').click()"
webview Runtime evaluate "document.querySelector('output').textContent === '1' ? 'PASS: 1' : 'FAIL: expected 1'"
webview Runtime evaluate "document.querySelector('button.btn').click()"
webview Runtime evaluate "document.querySelector('output').textContent === '0' ? 'PASS: 0' : 'FAIL: expected 0'"
webview Runtime evaluate "document.querySelector('button.btn').click()"
webview Runtime evaluate "document.querySelector('output').textContent === '-1' ? 'PASS: -1' : 'FAIL: expected -1'"
'@ | dotnet tool run maui -- devflow batch -ap $port --delay 750

if ($LASTEXITCODE -ne 0) { throw 'DevFlow batch failed.' }
foreach ($line in $results) {
    $result = $line | ConvertFrom-Json
    if ($result.exit_code -ne 0 -or $result.output -match '(?m)^Error:|FAIL:') {
        throw "DevFlow command failed: $($result.command): $($result.output)"
    }
    $result.output
}
```

The delay lets UI rendering settle; it is not a replacement for waiting for
agent/CDP readiness or asserting actual values. For asynchronous operations,
use bounded condition checks instead of assuming a delay proves completion.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--delay <ms>` | 250 | Delay between commands (lets UI settle) |
| `--continue-on-error` | false | Continue after a command fails (default: stop) |
| `--human` | false | Human-readable output instead of JSONL |

## JSONL Response Format

One JSON object per command, streamed as each completes:
```json
{"command":"ui tap --automationId IncrementCount","exit_code":0,"output":"{\"success\":true}"}
{"command":"webview Runtime evaluate \"...\"","exit_code":0,"output":"FAIL: expected 1"}
```

Inspect `output`, not only `exit_code`: the pinned WebView helpers can return
`Error: Uncaught` with exit code 0. Even a predicate returning `FAIL:` is a
successful JavaScript evaluation, so the caller must reject it explicitly.
Do not use `--continue-on-error` for normal acceptance checks; reserve it for
intentional failure reproduction.

## Interactive Streaming

The batch command processes stdin line-by-line, so a caller can read each JSONL response
before sending the next command. This enables reactive workflows where the AI agent inspects
results and decides the next action. Keep that same process alive; creating
a new batch for each step loses the shared lease identity. If the host cannot
stream to a process, plan the full action/readback sequence before starting it.

## Input Rules

- Lines starting with `#` are comments (skipped)
- Empty lines are skipped
- Semicolons separate multiple commands on one line
- Quoted strings are preserved: `webview Runtime evaluate "document.title"`
- Use current `ui` and `webview` command names, not legacy `MAUI` or `cdp`
- Run discovery (`wait`, `list`, `agent status`) outside the batch
- Use CLI `--help` or `devflow commands` to confirm supported commands
