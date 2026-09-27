using System.Text.Json;
using System.Text.RegularExpressions;
using SketchToApp.Web.Models;

namespace SketchToApp.Web.Services;

public static partial class SketchFile
{
    public const long MaxFileBytes = 5_000_000;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public static string Export(BoardDocument document) =>
        JsonSerializer.Serialize(document.Copy(), JsonOptions);

    public static BoardDocument Import(string json)
    {
        using var data = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 32 });
        var document = data.RootElement;
        var width = Property(document, "width", JsonValueKind.Number);
        var height = Property(document, "height", JsonValueKind.Number);
        if (!width.TryGetInt32(out var w) || w != 1200 ||
            !height.TryGetInt32(out var h) || h != 800)
            throw new InvalidDataException("The board must be 1200 × 800 logical pixels.");

        var notes = Property(document, "notes", JsonValueKind.String).GetString()!;
        if (notes.Length > 10000)
            throw new InvalidDataException("Notes cannot exceed 10,000 characters.");

        var strokes = Property(document, "strokes", JsonValueKind.Array);
        if (strokes.GetArrayLength() > 800)
            throw new InvalidDataException("A sketch cannot contain more than 800 strokes.");
        var pointCount = 0;
        foreach (var stroke in strokes.EnumerateArray())
        {
            var tool = Property(stroke, "tool", JsonValueKind.String).GetString();
            var color = Property(stroke, "color", JsonValueKind.String).GetString();
            var size = Property(stroke, "size", JsonValueKind.Number);
            if (tool is not ("pen" or "eraser") || color is null || !HexColor().IsMatch(color) ||
                !size.TryGetSingle(out var strokeSize) || !float.IsFinite(strokeSize) ||
                strokeSize is < 1 or > 100)
                throw new InvalidDataException("Each stroke requires a pen or eraser tool, #RRGGBB color, and size from 1 to 100.");

            var points = Property(stroke, "points", JsonValueKind.Array);
            pointCount += points.GetArrayLength();
            if (points.GetArrayLength() is < 1 or > 4000 || pointCount > 80000)
                throw new InvalidDataException("A sketch is limited to 4,000 points per stroke and 80,000 points overall.");
            foreach (var point in points.EnumerateArray())
            {
                var x = Property(point, "x", JsonValueKind.Number);
                var y = Property(point, "y", JsonValueKind.Number);
                if (!x.TryGetSingle(out var px) || !y.TryGetSingle(out var py) ||
                    !float.IsFinite(px) || !float.IsFinite(py) ||
                    px is < 0 or > 1200 || py is < 0 or > 800)
                    throw new InvalidDataException("Stroke points must be inside the 1200 × 800 board.");
            }
        }
        return JsonSerializer.Deserialize<BoardDocument>(json, JsonOptions)
            ?? throw new InvalidDataException("The sketch JSON must contain a board document.");
    }

    private static JsonElement Property(JsonElement parent, string name, JsonValueKind kind)
    {
        if (parent.ValueKind != JsonValueKind.Object ||
            !parent.TryGetProperty(name, out var value) || value.ValueKind != kind)
            throw new InvalidDataException($"The sketch JSON requires a {kind.ToString().ToLowerInvariant()} '{name}' field.");
        return value;
    }

    [GeneratedRegex("^#[0-9a-fA-F]{6}$", RegexOptions.CultureInvariant)]
    private static partial Regex HexColor();
}
