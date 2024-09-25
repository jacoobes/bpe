import { readFileSync, writeFileSync, existsSync } from 'fs'
import { frequencies } from './shared.js'



function make_ngrams (arr, n) {
    const ngrams = []
    for (let i = 0; i < arr.length-n+1; i++) {
        let ngram=""
        for (let j = 0; j < n; j++) {
            ngram+=arr[i+j]
            if(j != n-1) {
                ngram+="%"
            }
        }
        ngrams.push( ngram )
   }
    return ngrams
}


export class Ngram {
    constructor(name, n, tokenizer) {
        this.n = n
        this.tokenizer = tokenizer
        this.model_name = name
        this.model = this._load_vocabulary()
    }
    _load_vocabulary() {
        if (existsSync(this.model_name)) {
            this.trained = true
            return JSON.parse(readFileSync(this.model_name, { encoding: 'utf8' }))
        }else{
            this.trained = false 
            return {};
        }
    }
    train(corpus, save=false) {
        const [tokens, tids] = this.tokenizer.tokenize(corpus)
        //console.log(tokens)
        const ngrams = make_ngrams(tokens, this.n+1)
        const ngramfrequences = frequencies(ngrams)
        for (const ngram of ngrams) {
            const freq = ngramfrequences.get(ngram) 
            if(freq) {
                const tokens = ngram.split('%')
                const previous = tokens.slice(0,this.n)
                const key = previous.join("^")
                if(!this.model[key]) {
                   this.model[key] = []
                }
                this.model[key].push(tokens.at(-1))
            }
        }
        if(save) {
            writeFileSync(this.model_name,
                JSON.stringify(this.model), { 'encoding': 'utf8' }, 4)
        }
        
    }

    predict(words) {
        const [tokens] = this.tokenizer.tokenize(words)
        let out = ""
        let next = tokens.slice(tokens.length-this.n).join("^")
        out += tokens.slice(tokens.length-this.n).join("") 
        const keys = Array.from(Object.keys(this.model))
        for(let i = 0; i < 100; i++) {
            const choices = this.model[next]
            if(!choices) {
                const ran = keys[Math.floor(Math.random() * keys.length)]
                next = ran
                // this is just for ws tokenizer, need
                out += ran.split('^').join('')
            } else {
                const choice = choices[Math.floor(Math.random() * choices.length)]
                next = choice
                out +=  choice 
            }
        }
        return out
    }
}

//class WSTokenizer { 
//    tokenize(text) {
//        return [text.split(/\s+/), []]
//    }
//}
//
//const ngram = new Ngram('moby2.json', 2, new WSTokenizer())

//ngram.train(readFileSync('moby.txt', { encoding: 'utf8' }))


//ngram.train(readFileSync('moby.txt', { encoding: 'utf8' }))
//console.log(ngram.predict("Moby Dick"))




