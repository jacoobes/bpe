import { readFileSync, writeFileSync, existsSync } from 'fs'
import { BPE } from './bpe.js'
import { frequencies } from './shared.js'

// clojure util
const assoc_in = (map, keys, val) => { 
    keys.reduce((acc, next, idx) => {
        if(idx == keys.length - 1) {
            acc[next] = val
        } else {
            acc[next] = {}
        }
        return acc[next]
    }, map)
    return map
}

const deep_has = (map, keys) => {
    
}

function make_ngrams (arr, n) {
    const ngrams = []
    for (let i = 0; i < arr.length-n+1; i++) {
        let ngram=""
        for (let j = 0; j < n; j++) {
            ngram+=arr[i+j]
            ngram+="%"
        }
        ngrams.push( ngram )
   }
    return ngrams
}


class Ngram {
    constructor(name, n, tokenizer) {
        this.n = n
        this.tokenizer = tokenizer
        this.model_name = name
        this.model = this._load_vocabulary()
    }
    _load_vocabulary() {
        if (existsSync(this.model_name)) {
            this.trained = true
            return new JSON.parse(readFileSync(this.model_name, { encoding: 'utf8' }))
        }else{
            this.trained = false 
            return {};
        }
    }
    train(corpus) {
        const [tokens, tids] = this.tokenizer.tokenize(corpus)
        const ngrams = make_ngrams(tokens, this.n+1)
        const ngramfrequences = frequencies(ngrams)
        for (const ngram of ngrams) {
            const freq = ngramfrequences.get(ngram) 
            if(freq) {
                const tokens = ngram.split('%')
                const previous = tokens.slice(0,this.n)
                const last = tokens.at(-1)
                
                assoc_in(this.model, previous, [last]) 
                //console.log(first, last)
                if(!this.model[first]) {
                    this.model[first] = []
                }
                this.model[first].push(last)
               
            }
        }
        writeFileSync(this.model_name,
            JSON.stringify(this.model), { 'encoding': 'utf8' }, 4)
    }

    predict(words) {
        const [tokens] = this.tokenizer.tokenize(words)
        let out = ""
        let next = tokens.slice(tokens.length-this.n).join("")
        out += tokens.slice(tokens.length-this.n).join(" ")
        const keys = Array.from(Object.keys(this.model))
        for(let i = 0; i < 100; i++) {
            const choices = this.model.get(next)
            if(!choices) {
                const ran = keys[Math.floor(Math.random() * keys.length)]
                next = ran
                out +=  ran + " "
            } else {
                const choice = choices[Math.floor(Math.random() * choices.length)]
                next = choice
                out +=  choice + " "
            }
        }
        return out
    }
}

class WSTokenizer { 
    tokenize(text) {
        return [text.split(/\s+/), []]
    }
}

const ngram = new Ngram('woodchuck.json', 2, new WSTokenizer())

//ngram.train(readFileSync('moby.txt', { encoding: 'utf8' }))


ngram.train(readFileSync('moby.txt', { encoding: 'utf8' }))
console.log(ngram.predict("Moby Dick"))




