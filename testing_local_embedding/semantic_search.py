import argparse
from qdrant_client import models, QdrantClient
from sentence_transformers import SentenceTransformer

def search(query: str):
    encoder = SentenceTransformer("all-MiniLM-L6-v2")
    query_vector = encoder.encode(query).tolist()

    client = QdrantClient(host="localhost", port=6333, timeout=300)

    search_result = client.query_points(
        collection_name="local_filesystem_test",
        query=query_vector,
        limit=5
    )

    for hit in search_result.points:
        print(f"Score: {hit.score:.4f} - Path: {hit.payload['file_path']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Semantic search for files in a Qdrant collection.")
    parser.add_argument("query", nargs='+', help="The search query.")
    args = parser.parse_args()
    search(" ".join(args.query))