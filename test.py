def find_ngrams(input_list, n):
  return zip(*[input_list[i:] for i in range(n)])



print(list(find_ngrams([1,2,3], 4)))
