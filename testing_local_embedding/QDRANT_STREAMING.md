# Streaming Search Results in Qdrant

The concept of "streaming" search results is about the server sending back results as it finds them, rather than collecting all results and sending them in a single, monolithic response. This is primarily achieved through **gRPC**, not the standard REST API.

## 1. The Standard REST API (What we're using now)

*   **Mechanism:** Standard HTTP Request/Response.
*   **Flow:** Your client sends a `POST` request to the `/collections/{name}/points/search` endpoint. The Qdrant server performs the entire search, gathers all the top K results, and then sends them back in a single JSON object.
*   **Analogy:** You order a 5-course meal, and the kitchen prepares all five courses before bringing them to your table at once.
*   **Pros:** Simple to use, stateless, and works with any standard HTTP client (like `fetch` in a browser or `requests` in Python).
*   **Cons:** You have to wait for the *slowest* part of the search to finish before you see the *first* result. This can feel slow if the result set is large or the query is complex.

## 2. The gRPC API (The streaming approach)

*   **Mechanism:** Server-side streaming RPC (Remote Procedure Call).
*   **Flow:** Your client calls the `SearchPoints` method on the Qdrant gRPC server. The server immediately establishes a persistent connection and starts sending back a stream of `ScoredPoint` messages as they are identified on the server. The client can process each point the moment it arrives.
*   **Analogy:** You're at a sushi bar. The chef places each piece of sushi in front of you the moment it's ready, and you can eat it immediately without waiting for the whole order.
*   **Pros:**
    *   **Low Latency for First Result:** You can display the very first result to the user almost instantly.
    *   **Large Result Sets:** Efficiently handle queries that might return thousands of results without high memory usage on the client or server.
*   **Cons:** More complex to implement. Requires a gRPC client library and knowledge of Protocol Buffers (`.proto` files).

---

## API Support for Streaming

### JS/TS API

The official Qdrant JavaScript client, `@qdrant/js-client-rest`, is a wrapper around the **REST API**. Therefore, it **does not support streaming** out-of-the-box. When you call the `search` method, it returns a `Promise` that resolves with the full list of results once the server has sent the complete JSON response.

To use streaming in a Node.js (or browser, with more effort) environment, you would have to bypass the official REST client and use a generic gRPC client library like `@grpc/grpc-js`. You would then load Qdrant's `.proto` files to generate the necessary client code to call the streaming `SearchPoints` RPC. This is a much more advanced use case.

### "MCP Server" and General Server Capabilities

I believe "MCP" might refer to the **Qdrant Cloud** offering or a general server instance. The key takeaway is that this is a **protocol-level feature, not a server-type feature**.

Any standard Qdrant server instance, whether it's running in Docker, on your local machine, or on Qdrant Cloud, exposes two ports by default:

*   **Port `6333`:** For gRPC traffic.
*   **Port `6334`:** For REST (HTTP) traffic.

The ability to stream is inherent to the server's gRPC interface. The choice of whether to use streaming or not depends entirely on which protocol and port your *client* decides to connect to.

## Summary

| Feature        | REST API (e.g., Python/JS clients)                                       | gRPC API                                                                                     |
| :------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Mechanism**  | HTTP Request/Response                                                    | Server-side Streaming                                                                        |
| **Data Format**| JSON                                                                     | Protocol Buffers                                                                             |
| **Streaming?** | **No**                                                                   | **Yes**                                                                                      |
| **Use Case**   | Simple, standard search queries. Web frontends.                          | High-performance backends, real-time applications, very large result sets.                   |
| **JS/TS Support**| Yes, via `@qdrant/js-client-rest`.                                       | Requires a separate gRPC library (`@grpc/grpc-js`) and manual setup.                         |

In short: for a typical web application, the standard REST client is much simpler and usually fast enough. If you're building a high-performance backend service in a language like Go, Rust, or Java (or even Node.js) and need the absolute lowest latency for displaying initial results, then using the gRPC API for streaming is the way to go.
