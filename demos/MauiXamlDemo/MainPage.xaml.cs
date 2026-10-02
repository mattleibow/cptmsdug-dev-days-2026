using CounterCore;

namespace MauiXamlDemo;

public partial class MainPage : ContentPage
{
	readonly CounterService counter = new();

	public MainPage()
	{
		InitializeComponent();
	}

	private void OnCounterClicked(object? sender, EventArgs e)
	{
		var count = counter.Increment();

		if (count == 1)
			CounterBtn.Text = $"Clicked {count} time";
		else
			CounterBtn.Text = $"Clicked {count} times";

		SemanticScreenReader.Announce(CounterBtn.Text);
	}
}
