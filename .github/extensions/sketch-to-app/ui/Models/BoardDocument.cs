namespace SketchToApp.Web.Models;

// JSON uses camelCase in BoardApi; coordinates and dimensions are logical board pixels.
public sealed class BoardDocument
{
    public int Width { get; set; } = 1200;
    public int Height { get; set; } = 800;
    public List<BoardStroke> Strokes { get; set; } = [];
    public string Notes { get; set; } = "";
    public string? BackgroundPngBase64 { get; set; }

    public BoardDocument Copy() => new()
    {
        Width = Width,
        Height = Height,
        Notes = Notes,
        BackgroundPngBase64 = BackgroundPngBase64,
        Strokes = Strokes.Select(stroke => new BoardStroke
        {
            Tool = stroke.Tool,
            Color = stroke.Color,
            Size = stroke.Size,
            Points = stroke.Points.Select(point => new BoardPoint { X = point.X, Y = point.Y }).ToList()
        }).ToList()
    };
}

public sealed class BoardStroke
{
    public string Tool { get; set; } = "pen";
    public string Color { get; set; } = "#273449";
    public float Size { get; set; } = 4;
    public List<BoardPoint> Points { get; set; } = [];
}

public sealed class BoardPoint
{
    public float X { get; set; }
    public float Y { get; set; }
}

public sealed class BoardState
{
    public int Version { get; set; }
    public BoardDocument Document { get; set; } = new();
}

public sealed class BuildRequest
{
    public int Version { get; set; }
    public BoardDocument Document { get; set; } = new();
    public string PngBase64 { get; set; } = "";
}

public sealed class BuildResult
{
    public string MessageId { get; set; } = "";
    public string SnapshotPath { get; set; } = "";
    public int Version { get; set; }
}
