using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SketchToApp.Web.Models;

namespace SketchToApp.Web.Services;

public sealed class BoardApi(HttpClient http)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<BoardState> LoadAsync()
    {
        using var response = await http.GetAsync("/api/state");
        EnsureSuccess(response);
        return await ReadAsync<BoardState>(response);
    }

    public async Task<byte[]> LoadPendingImageAsync(int version)
    {
        using var response = await http.GetAsync($"/api/import-image?version={version}");
        EnsureSuccess(response);
        return await response.Content.ReadAsByteArrayAsync();
    }

    public async Task<BoardState> SaveAsync(SaveRequest request)
    {
        using var response = await http.PutAsJsonAsync("/api/state", request, JsonOptions);
        EnsureSuccess(response);
        return await ReadAsync<BoardState>(response);
    }

    private static async Task<T> ReadAsync<T>(HttpResponseMessage response)
    {
        return await response.Content.ReadFromJsonAsync<T>(JsonOptions)
            ?? throw new InvalidOperationException("The server returned an empty response.");
    }

    private static void EnsureSuccess(HttpResponseMessage response)
    {
        if (response.StatusCode == HttpStatusCode.Conflict)
            throw new BoardConflictException();
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException(
                $"Server returned {(int)response.StatusCode} ({response.ReasonPhrase}).",
                null, response.StatusCode);
    }
}

public sealed class BoardConflictException() : Exception("This board changed in chat or another window.");
