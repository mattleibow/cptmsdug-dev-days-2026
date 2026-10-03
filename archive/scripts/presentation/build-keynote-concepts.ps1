param(
    [string]$PreviewDirectory
)

$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$source = Join-Path $root 'docs\source-material\copilot-app-english.pptx'
$output = Join-Path $root 'docs\decks\design-explorations\keynote-concepts.pptx'
$work = Join-Path ([System.IO.Path]::GetTempPath()) ('dev-days-concepts-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $work | Out-Null

function Get-Color([string]$Hex) {
    $r = [Convert]::ToInt32($Hex.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($Hex.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($Hex.Substring(4, 2), 16)
    return $r + ($g -shl 8) + ($b -shl 16)
}

function Add-Text($Slide, [string]$Text, $X, $Y, $W, $H, $Size, $Color, [bool]$Bold = $false) {
    $shape = $Slide.Shapes.AddTextbox(1, $X * 72, $Y * 72, $W * 72, $H * 72)
    $shape.TextFrame.MarginLeft = 0
    $shape.TextFrame.MarginRight = 0
    $shape.TextFrame.MarginTop = 0
    $shape.TextFrame.MarginBottom = 0
    $shape.TextFrame.WordWrap = -1
    $shape.TextFrame.TextRange.Text = $Text
    $shape.TextFrame.TextRange.Font.Name = 'Arial'
    $shape.TextFrame.TextRange.Font.Size = $Size
    $shape.TextFrame.TextRange.Font.Color.RGB = Get-Color $Color
    $shape.TextFrame.TextRange.Font.Bold = $(if ($Bold) { -1 } else { 0 })
    return $shape
}

function Add-Slide($Deck, $Color) {
    $slide = $Deck.Slides.Add($Deck.Slides.Count + 1, 12)
    $slide.FollowMasterBackground = 0
    $slide.Background.Fill.Solid()
    $slide.Background.Fill.ForeColor.RGB = Get-Color $Color
    $slide.SlideShowTransition.EntryEffect = 1793
    $slide.SlideShowTransition.Duration = 0.55
    $slide.SlideShowTransition.AdvanceOnClick = -1
    $slide.SlideShowTransition.AdvanceOnTime = 0
    return $slide
}

function Add-Reveal($Slide, $Shape, $Trigger = 1) {
    $effect = $Slide.TimeLine.MainSequence.AddEffect($Shape, 10, 0, $Trigger)
    $effect.Timing.Duration = 0.45
}

function Add-Notes($Slide, [string]$Text) {
    $Slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $Text
}

$deck = $null
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($source)
    try {
        $entry = $archive.GetEntry('ppt/media/image45.png')
        if (-not $entry) { throw 'Official Copilot artwork is missing from the source deck.' }
        $art = Join-Path $work 'copilot.png'
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $art)
    } finally {
        $archive.Dispose()
    }

    $app = New-Object -ComObject PowerPoint.Application
    $deck = $app.Presentations.Add(0)
    $deck.PageSetup.SlideWidth = 12188825 / 12700
    $deck.PageSetup.SlideHeight = 6858000 / 12700
    $width = $deck.PageSetup.SlideWidth / 72
    $height = $deck.PageSetup.SlideHeight / 72

    $slide = Add-Slide $deck '101411'
    $hero = Join-Path $root 'docs\assets\event\branding\devdays2026hero.png'
    $picture = $slide.Shapes.AddPicture($hero, 0, -1, 0, 0, $width * 72, $height * 72)
    # Crop, rather than distort, the supplied slightly taller event image.
    $format = $picture.PictureFormat.Crop
    $format.PictureWidth = $width * 72
    $format.PictureHeight = $width * 72 * 1024 / 1792
    $format.PictureOffsetX = 0
    $format.PictureOffsetY = 0
    $title = Add-Text $slide "DEV`rDAYS" 0.55 0.55 2.15 1.6 48 'FFFFFF' $true
    $location = Add-Text $slide "CAPE TOWN`r2026" 0.58 2.6 2.15 0.85 22 '8CF2A9' $true
    $null = Add-Text $slide "3 OCTOBER  /  BBD CAPE TOWN" 0.6 6.65 7 0.3 16 'FFFFFF' $true
    $null = Add-Text $slide 'A day for builders.' 0.6 7.03 7 0.27 15 'BFFFD1'
    Add-Reveal $slide $title 3
    Add-Reveal $slide $location 3
    Add-Notes $slide 'CONCEPT 1: Community opener. Preserve the event hero, mascot, shirt mark and GitHub cube. Title arrives with the slide; location follows. This is a visual direction sample, not the final keynote.'

    $slide = Add-Slide $deck '101411'
    $null = Add-Text $slide 'GITHUB COPILOT' 0.7 0.65 8 0.35 18 'BFFFD1' $true
    $first = Add-Text $slide "From writing`rcode." 0.65 1.6 7.8 1.85 64 'FFFFFF' $true
    $second = Add-Text $slide "To directing`rthe work." 0.65 3.8 8.2 1.85 64 '8CF2A9' $true
    $null = $slide.Shapes.AddPicture($art, 0, -1, 8.2 * 72, 1.65 * 72, 4.8 * 72, 4.8 * 72)
    Add-Reveal $slide $second
    Add-Notes $slide 'CONCEPT 2: Statement and reveal. Start with "From writing code." Click once to reveal "To directing the work." The official 3D Copilot is retained. Narration: Copilot spans assistance and delegation; people remain accountable for scope, review and delivery.'

    $slide = Add-Slide $deck 'FFFFFF'
    $null = Add-Text $slide "One Copilot.`rDifferent ways to work." 0.65 0.65 11.8 1.65 48 '101411' $true
    $columns = @(
        @{ X=0.7; Number='01'; Title="IDE + CLI"; Claim="Stay in your flow."; Detail="Work interactively in your`reditor or terminal." },
        @{ X=4.95; Number='02'; Title="CLOUD AGENT"; Claim="Delegate a task."; Detail="Hand off scoped work.`rReview the pull request." },
        @{ X=9.2; Number='03'; Title="COPILOT APP"; Claim="Bring it together."; Detail="Direct sessions. Review work.`rShare live canvases." }
    )
    foreach ($column in $columns) {
        $disc = $slide.Shapes.AddShape(9, $column.X * 72, 3.05 * 72, 0.75 * 72, 0.75 * 72)
        $disc.Fill.ForeColor.RGB = Get-Color '0E6836'
        $disc.Line.Visible = 0
        $number = Add-Text $slide $column.Number ($column.X + 0.12) 3.22 0.55 0.3 20 'FFFFFF' $true
        $heading = Add-Text $slide $column.Title $column.X 4.1 3.5 0.45 24 '0E6836' $true
        $null = Add-Text $slide $column.Claim $column.X 4.8 3.55 0.95 32 '101411' $true
        $null = Add-Text $slide $column.Detail $column.X 6.05 3.5 0.85 18 '232925'
    }
    Add-Notes $slide 'CONCEPT 3: High-key ecosystem beat. No miniature screenshot grid, decorative rails, or boxed cards. The three surfaces are an illustrative selection, not the full ecosystem. IDE and CLI permissions/workspace capabilities differ; the App supports both local and cloud workflows. Do not imply universal feature parity.'

    $inserted = $deck.Slides.InsertFromFile($source, 3, 11, 11)
    if ($inserted -ne 1) { throw 'Could not import the native Canvas video slide.' }
    $slide = $deck.Slides.Item(4)
    $titleFound = $false
    $captionFound = $false
    foreach ($shape in $slide.Shapes) {
        if ($shape.HasTextFrame -ne -1 -or $shape.TextFrame.HasText -ne -1) { continue }
        $text = $shape.TextFrame.TextRange.Text.Trim()
        if ($text -eq 'Canvases') {
            $shape.TextFrame.TextRange.Text = 'Work on the same thing.'
            $shape.TextFrame.TextRange.Font.Name = 'Arial'
            $shape.TextFrame.TextRange.Font.Size = 38
            $shape.TextFrame.TextRange.Font.Bold = -1
            $shape.TextFrame.TextRange.Font.Color.RGB = Get-Color 'FFFFFF'
            $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = 0
            $shape.Width = 12 * 72
            $titleFound = $true
        } elseif ($text.StartsWith('Open a live work surface')) {
            $shape.TextFrame.TextRange.Text = 'YOU + YOUR AGENT. ONE SHARED SURFACE.'
            $shape.TextFrame.TextRange.Font.Name = 'Arial'
            $shape.TextFrame.TextRange.Font.Size = 16
            $shape.TextFrame.TextRange.Font.Color.RGB = Get-Color 'E4EBE6'
            $shape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = 0
            $captionFound = $true
        }
    }
    if (-not $titleFound -or -not $captionFound) { throw 'Source Canvas slide text no longer matches the expected structure.' }
    Add-Notes $slide 'CONCEPT 4: Native product footage. Imported from official source slide 11, preserving the embedded video and its animation/playback tree. Headline and caption are retargeted in place. This concept demonstrates reuse, not a promise that playback has been rehearsed. Rehearse in Slide Show on the event machine.'

    $deck.SaveAs($output, 24)
    if ($PreviewDirectory) {
        New-Item -ItemType Directory -Path $PreviewDirectory -Force | Out-Null
        for ($i = 1; $i -le $deck.Slides.Count; $i++) {
            $slidePath = Join-Path $PreviewDirectory ('concept-{0:D2}.png' -f $i)
            $deck.Slides.Item($i).Export($slidePath, 'PNG', 1600, 900)
        }
    }
    Write-Output $output
} finally {
    if ($deck) { $deck.Close() }
    if (Test-Path (Join-Path $work 'copilot.png')) { Remove-Item (Join-Path $work 'copilot.png') }
    Remove-Item $work
    # Never quit PowerPoint: the presenter may have other decks open.
}
