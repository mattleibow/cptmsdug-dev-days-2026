using System.Text.Json;

namespace CounterCore;

public sealed class CounterService
{
    private const string SettingsResourceName = "CounterCore.CounterSettings.json";

    private static readonly int Step = 1;

    static CounterService()
    {
        using var stream = typeof(CounterService).Assembly.GetManifestResourceStream(SettingsResourceName);
        if (stream is null)
            return;

        using var settings = JsonDocument.Parse(stream);
        var step = settings.RootElement.GetProperty("step").GetInt32();
        if (step <= 0)
            return;

        Step = step;
    }

    public int Count { get; private set; }

    public int Increment()
    {
        return Count += Step;
    }

    public int Decrement()
    {
        if (Count > 0)
            --Count;

        return Count;
    }
}
