using CounterCore;

namespace MauiXamlDemo;

public partial class MainPage : ContentPage
{
	readonly CounterService counter = new();

	public MainPage()
	{
		InitializeComponent();
	}

	private void OnPlusClicked(object? sender, EventArgs e)
	{
		UpdateCount(counter.Increment());
	}

	private void OnMinusClicked(object? sender, EventArgs e)
	{
		UpdateCount(counter.Decrement());
	}

	private void UpdateCount(int count)
	{
		CountLabel.Text = count.ToString();
		var description = $"Current count: {count}";
		SemanticProperties.SetDescription(CountLabel, description);
		SemanticScreenReader.Announce(description);
	}
}
