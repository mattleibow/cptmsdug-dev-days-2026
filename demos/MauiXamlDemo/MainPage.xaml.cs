using System.Net.Mail;

namespace MauiXamlDemo;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
    }

    private void OnPasswordCompleted(object? sender, EventArgs e) => SignIn();

    private void OnLoginClicked(object? sender, EventArgs e) => SignIn();

    private void SignIn()
    {
        var email = EmailEntry.Text?.Trim() ?? string.Empty;
        if (!MailAddress.TryCreate(email, out var address) ||
            !string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase))
        {
            ShowError("Enter a valid email address.");
            return;
        }

        if (string.IsNullOrWhiteSpace(PasswordEntry.Text))
        {
            ShowError("Enter a password.");
            return;
        }

        ErrorLabel.IsVisible = false;
        PasswordEntry.Text = string.Empty;
        WelcomeLabel.Text = $"Welcome, {email}";
        SignInView.IsVisible = false;
        DashboardView.IsVisible = true;
        SemanticScreenReader.Announce("Dashboard");
    }

    private void ShowError(string message)
    {
        ErrorLabel.Text = message;
        ErrorLabel.IsVisible = true;
        SemanticScreenReader.Announce(message);
    }

    private void OnSignOutClicked(object? sender, EventArgs e)
    {
        EmailEntry.Text = string.Empty;
        PasswordEntry.Text = string.Empty;
        ErrorLabel.IsVisible = false;
        DashboardView.IsVisible = false;
        SignInView.IsVisible = true;
        SemanticScreenReader.Announce("Sign in");
    }
}
