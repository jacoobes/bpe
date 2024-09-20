import { readFileSync, writeFileSync, existsSync } from 'fs'
import {  BPE } from './bpe.js'
import { frequencies } from './shared.js'


function make_ngrams (arr, n) {
    const ngrams = []
    for (let i = 0; i < arr.length-n+1; i++) {
        let ngram=""
        for (let j = 0; j < n-1; j++) {
            ngram+=arr[i+j]
        }
        ngram+="%"
        ngram+=arr[i+n-1]
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
            return new Map(Object.entries(JSON.parse(readFileSync(this.model_name, { encoding: 'utf8' }))))
        }else{
            this.trained = false 
            return new Map()
        }
    }
    train(corpus) {
        const [tokens, tids] = this.tokenizer.tokenize(corpus)
        console.log(tokens)
        const ngrams = make_ngrams(tokens, this.n+1)
        const ngramfrequences = frequencies(ngrams)
        for (const ngram of ngrams) {
            const freq = ngramfrequences.get(ngram) 
            if(freq) {
                const [first, last] = ngram.split('%')
                //console.log(first, last)
                if(!this.model.has(first)) {
                    this.model.set(first, [])
                } 
                this.model.get(first).push(last)
               
            }
        }
        writeFileSync(this.model_name,
            JSON.stringify(Object.fromEntries(this.model.entries())), { 'encoding': 'utf8' }, 4)
    }

    predict(words) {
        const [tokens] = this.tokenizer.tokenize(words)
        let out = ""
        let next = tokens.slice(tokens.length-this.n).join("")
        out += next
        const keys = Array.from(this.model.keys())
        for(let i = 0; i < 100; i++) {
            console.log(next)
            const choices = this.model.get(next)
            if(!choices) {
                console.log("random")
                const ran = keys[Math.floor(Math.random() * keys.length)]
                next = ran
                out += ran
            } else {
                const choice = choices[Math.floor(Math.random() * choices.length)]
                next = choice
                out += choice
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


console.log(ngram.train("How much wood could a woodchuck chuck?"))




