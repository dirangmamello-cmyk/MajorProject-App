const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json; charset=utf-8",
};

const sseHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

const systemPrompt =
  "You are ArkFinance AI, a friendly and knowledgeable personal finance assistant. Help users with budgeting, saving tips, investment basics, expense tracking advice, and financial goal setting. Keep answers clear, concise, and actionable. Use emojis sparingly for friendliness. If asked about something outside finance, politely redirect to financial topics.";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function isValidMessages(value: unknown): value is Array<{ role: string; content: string }> {
  return Array.isArray(value) && value.every((message) => {
    return (
      typeof message === "object" &&
      message !== null &&
      typeof message.role === "string" &&
      typeof message.content === "string"
    );
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("Missing LOVABLE_API_KEY secret");
      return jsonResponse({ error: "Server configuration error: LOVABLE_API_KEY is not configured." }, 500);
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const messages = typeof body === "object" && body !== null ? (body as { messages?: unknown }).messages : undefined;

    if (!isValidMessages(messages)) {
      return jsonResponse({ error: "Request body must include a valid messages array." }, 400);
    }

    const gatewayResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!gatewayResponse.ok) {
      if (gatewayResponse.status === 429) {
        return jsonResponse({ error: "Rate limited. Please try again shortly." }, 429);
      }

      if (gatewayResponse.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add funds." }, 402);
      }

      const errorText = await gatewayResponse.text();
      console.error("AI gateway error:", gatewayResponse.status, errorText);
      return jsonResponse({ error: "AI gateway error" }, 500);
    }

    if (!gatewayResponse.body) {
      console.error("AI gateway returned an empty response body");
      return jsonResponse({ error: "AI gateway returned an empty response." }, 500);
    }

    return new Response(gatewayResponse.body, {
      status: 200,
      headers: sseHeaders,
    });
  } catch (error) {
    console.error("chat error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
