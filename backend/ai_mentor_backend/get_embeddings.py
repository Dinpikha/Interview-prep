# from transformers import AutoTokenizer, AutoModel
# import torch

# tokenizer = None
# model = None

# def load_model():
#     global tokenizer, model

#     if tokenizer is None:
#         tokenizer = AutoTokenizer.from_pretrained("BAAI/bge-small-en-v1.5")
#         model = AutoModel.from_pretrained("BAAI/bge-small-en-v1.5")
#         model.eval()

#     return tokenizer, model


# def get_embeddings(texts: str):
#     tokenizer, model = load_model()

#     encoded_input = tokenizer(
#         texts,
#         padding=True,
#         truncation=True,
#         return_tensors="pt"
#     )

#     with torch.no_grad():
#         model_output = model(**encoded_input)
#         sentence_embeddings = model_output[0][:, 0]

#     sentence_embeddings = torch.nn.functional.normalize(
#         sentence_embeddings,
#         p=2,
#         dim=1
#     )

#     return sentence_embeddings[0].tolist()