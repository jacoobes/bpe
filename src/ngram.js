import  './bpe.js'


function* ngram (arr, n) {
    for (let i = 0; i < arr.length-n+1; i++) {
        const gramarr = []
        for (let j = 0; j < n; j++) {
            gramarr.push(arr[i+j])
        }
        yield gramarr
   }
}

console.log(Array.from(ngram([1,2,3], 4)))


