using System.Text.Json;

namespace CounterCore;

public sealed class CounterService
{
    private const string SettingsResourceName = "CounterCore.counter-settings.json";
    private static readonly int Step = LoadStep();

    public int Count { get; private set; }

    public int Increment()
    {
        return Count += Step;
    }

    private static int LoadStep()
    {
        using var stream = typeof(CounterService).Assembly.GetManifestResourceStream(SettingsResourceName)
            ?? throw new InvalidOperationException($"Missing embedded counter settings: {SettingsResourceName}");
        using var settings = JsonDocument.Parse(stream);
        var step = settings.RootElement.GetProperty("step").GetInt32();
        if (step <= 0)
            throw new InvalidDataException("Counter step must be a positive integer.");

        return step;
    }
}
