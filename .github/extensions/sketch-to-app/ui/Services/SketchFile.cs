using SkiaSharp;

namespace SketchToApp.Web.Services;

public static class SketchFile
{
    public const long MaxFileBytes = 8 * 1024 * 1024;
    private const long MaxPixels = 16_000_000;
    private const int BoardWidth = 1200;
    private const int BoardHeight = 800;

    public static string ImportImage(byte[] bytes)
    {
        using var data = OpenData(bytes);
        using var codec = OpenCodec(data);
        if (codec.EncodedFormat is not (SKEncodedImageFormat.Png or SKEncodedImageFormat.Jpeg))
            throw new InvalidDataException("Choose a PNG or JPEG image.");
        ValidateDimensions(codec.Info, false);

        using var bitmap = SKBitmap.Decode(data)
            ?? throw new InvalidDataException("The image is corrupt or could not be decoded.");
        using var surface = CreateBoardSurface();
        surface.Canvas.Clear(SKColors.White);
        var rotated = codec.EncodedOrigin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop
            or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
        var width = rotated ? bitmap.Height : bitmap.Width;
        var height = rotated ? bitmap.Width : bitmap.Height;
        var scale = Math.Min(BoardWidth / (float)width, BoardHeight / (float)height);
        var destination = new SKRect(
            (BoardWidth - width * scale) / 2, (BoardHeight - height * scale) / 2,
            (BoardWidth + width * scale) / 2, (BoardHeight + height * scale) / 2);
        DrawOrientedBitmap(surface.Canvas, bitmap, codec.EncodedOrigin, destination, scale);
        using var image = surface.Snapshot();
        using var encoded = image.Encode(SKEncodedImageFormat.Png, 100)
            ?? throw new InvalidDataException("Could not encode the imported image.");
        if (encoded.Size > MaxFileBytes)
            throw new InvalidDataException("The normalized PNG exceeds 8 MiB.");
        return Convert.ToBase64String(encoded.ToArray());
    }

    private static void DrawOrientedBitmap(SKCanvas canvas, SKBitmap bitmap, SKEncodedOrigin origin, SKRect destination, float scale)
    {
        canvas.Save();
        canvas.Translate(destination.Left, destination.Top);
        canvas.Scale(scale);
        // Decoding preserves the stored pixels; apply the image's EXIF orientation before fitting it.
        switch (origin)
        {
            case SKEncodedOrigin.TopLeft:
                break;
            case SKEncodedOrigin.TopRight:
                canvas.Translate(bitmap.Width, 0);
                canvas.Scale(-1, 1);
                break;
            case SKEncodedOrigin.BottomRight:
                canvas.Translate(bitmap.Width, bitmap.Height);
                canvas.Scale(-1, -1);
                break;
            case SKEncodedOrigin.BottomLeft:
                canvas.Translate(0, bitmap.Height);
                canvas.Scale(1, -1);
                break;
            case SKEncodedOrigin.LeftTop:
                canvas.RotateDegrees(90);
                canvas.Scale(1, -1);
                break;
            case SKEncodedOrigin.RightTop:
                canvas.Translate(bitmap.Height, 0);
                canvas.RotateDegrees(90);
                break;
            case SKEncodedOrigin.RightBottom:
                canvas.Translate(bitmap.Height, bitmap.Width);
                canvas.RotateDegrees(90);
                canvas.Scale(-1, 1);
                break;
            case SKEncodedOrigin.LeftBottom:
                canvas.Translate(0, bitmap.Width);
                canvas.RotateDegrees(-90);
                break;
            default:
                throw new InvalidDataException("The image orientation is unsupported.");
        }
        canvas.DrawBitmap(bitmap, new SKRect(0, 0, bitmap.Width, bitmap.Height),
            new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.None));
        canvas.Restore();
    }

    public static SKImage DecodeBackground(string base64)
    {
        byte[] bytes;
        try
        {
            if (base64.Length > ((MaxFileBytes + 2) / 3) * 4)
                throw new InvalidDataException("The saved background exceeds 8 MiB.");
            bytes = Convert.FromBase64String(base64);
        }
        catch (FormatException ex)
        {
            throw new InvalidDataException("The saved background is not valid base64.", ex);
        }

        using var data = OpenData(bytes);
        using var codec = OpenCodec(data);
        if (codec.EncodedFormat != SKEncodedImageFormat.Png)
            throw new InvalidDataException("The saved background must be a PNG.");
        ValidateDimensions(codec.Info, true);
        using var bitmap = SKBitmap.Decode(data)
            ?? throw new InvalidDataException("The saved background PNG is corrupt.");
        return SKImage.FromBitmap(bitmap)
            ?? throw new InvalidDataException("Could not load the saved background.");
    }

    private static SKData OpenData(byte[] bytes)
    {
        if (bytes.Length == 0 || bytes.LongLength > MaxFileBytes)
            throw new InvalidDataException("The image must be nonempty and no larger than 8 MiB.");
        return SKData.CreateCopy(bytes);
    }

    private static SKCodec OpenCodec(SKData data) =>
        SKCodec.Create(data) ?? throw new InvalidDataException("The image is unsupported or corrupt.");

    private static void ValidateDimensions(SKImageInfo info, bool boardOnly)
    {
        if (info.Width <= 0 || info.Height <= 0 || (long)info.Width * info.Height > MaxPixels ||
            (boardOnly && (info.Width != BoardWidth || info.Height != BoardHeight)))
            throw new InvalidDataException(boardOnly
                ? "The saved background must be a 1200 × 800 PNG."
                : "The image dimensions are invalid or exceed 16 million pixels.");
    }

    private static SKSurface CreateBoardSurface() =>
        SKSurface.Create(new SKImageInfo(BoardWidth, BoardHeight, SKColorType.Rgba8888, SKAlphaType.Opaque))
        ?? throw new InvalidOperationException("Could not create the board image.");
}
