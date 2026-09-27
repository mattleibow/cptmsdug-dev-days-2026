using SkiaSharp;
using SketchToApp.Web.Models;

namespace SketchToApp.Web.Services;

public static class BoardRenderer
{
    public static void Draw(SKCanvas canvas, BoardDocument document, BoardStroke? preview = null)
    {
        canvas.Clear(SKColors.White);
        foreach (var stroke in document.Strokes)
            DrawStroke(canvas, stroke);
        if (preview is not null)
            DrawStroke(canvas, preview);
    }

    private static void DrawStroke(SKCanvas canvas, BoardStroke stroke)
    {
        if (stroke.Points.Count == 0)
            return;

        using var paint = new SKPaint
        {
            Color = stroke.Tool == "eraser" ? SKColors.White :
                SKColor.TryParse(stroke.Color, out var color) ? color : SKColors.Black,
            StrokeWidth = stroke.Size,
            IsAntialias = true,
            StrokeCap = SKStrokeCap.Round,
            StrokeJoin = SKStrokeJoin.Round,
            Style = SKPaintStyle.Stroke
        };
        var first = stroke.Points[0];
        if (stroke.Points.Count == 1)
        {
            paint.Style = SKPaintStyle.Fill;
            canvas.DrawCircle(first.X, first.Y, stroke.Size / 2, paint);
        }
        else
        {
            var previous = first;
            foreach (var point in stroke.Points.Skip(1))
            {
                canvas.DrawLine(previous.X, previous.Y, point.X, point.Y, paint);
                previous = point;
            }
        }
    }

    public static string ExportPngBase64(BoardDocument document)
    {
        using var surface = SKSurface.Create(new SKImageInfo(
            document.Width, document.Height, SKColorType.Rgba8888, SKAlphaType.Opaque))
            ?? throw new InvalidOperationException("Could not create the board image.");
        Draw(surface.Canvas, document);
        using var image = surface.Snapshot();
        using var encoded = image.Encode(SKEncodedImageFormat.Png, 100)
            ?? throw new InvalidOperationException("Could not encode the board image.");
        return Convert.ToBase64String(encoded.ToArray());
    }
}
