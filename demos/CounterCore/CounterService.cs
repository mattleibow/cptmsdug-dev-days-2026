namespace CounterCore;

public sealed class CounterService
{
    public int Count { get; private set; }

    public int Increment()
    {
        return ++Count;
    }
}
