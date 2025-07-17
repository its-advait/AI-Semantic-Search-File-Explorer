package embeddings

// Adapter adapts the Service to implement the search.EmbeddingService interface
type Adapter struct {
	service *Service
}

// GenerateEmbedding generates an embedding for the given content
func (a *Adapter) GenerateEmbedding(content string) ([]float64, error) {
	return a.service.GenerateEmbedding(content)
}
