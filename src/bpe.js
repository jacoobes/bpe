import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'url'
import { frequencies } from './shared.js'


function* pairwise(arr) {
   for (let i = 0; i < arr.length-1; i++) {
       yield arr[i]+"%"+arr[i+1]
   }
}


function merge(tokens, best) {
    const newtokens = []    
    let i = 0;
    let skip = false
    while(i < tokens.length) {
        if(skip) {
            skip = false
            i+=1
            continue
        }
        if(i < tokens.length - 1 && (tokens[i] + tokens[i+1]) == best) {
            newtokens.push(best)
            skip = true
        } else {
            newtokens.push(tokens[i])
        }
        i+=1
    }
    return newtokens
}

export class BPE {
    constructor( model_name, verbose=false,) {
        this.model_name=model_name
        this.verbose = verbose
        this.trained=false
        this.model= this._load_vocabulary()
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
    train(_corpus, save = false, max_vocab = 500) {
        if(typeof(_corpus) != 'string') {
            throw Error("Cannot train nonstring")
        }
        if(this.trained) {
            console.warn("Already trained a model at "+this.model_name)
        }
        // frequency delimiter
        let tokens = Array.from(_corpus.replace(/%/g, ''));

        tokens.forEach(tok => {
            if(!this.model.has(tok)) {
                this.model.set(tok, this.model.size+1)
            }
        })
        
        while(this.model.size < max_vocab) {
            const pairedtokens = pairwise(tokens)
            const pairFreqs = frequencies(pairedtokens).entries()
            let maxpair, maxv = 0;
            for (const [pair, freq ]of pairFreqs) {
                if (freq > maxv) {
                    maxv = freq;
                    maxpair = pair;
                }
            }
            if (maxv == 1) {
                break;
            }
            const [lhs, rhs] = maxpair.split("%")
            const decodedPair = lhs+rhs
            tokens = merge(tokens, decodedPair)
            this.model.set(decodedPair, this.model.size+1)
        }
        this.model.set("<UNK>", this.model.size+1)
        if(save) {
            writeFileSync(this.model_name, JSON.stringify(Object.fromEntries(this.model), null, 4))
        }
        return this.model
    }
    tokenize(_data){
        if(typeof(_data) != 'string') {
            throw Error("Cannot train nonstring")
        }
        const tokens = [..._data.replaceAll("%", "")]
        let i = 0
        while (i < tokens.length) {
            let longest_match = null 
            for (const [k, v] of this.model.entries()) {
                if (tokens.slice(i, i+k.length).join("") == k) {
                    longest_match = k
                }
            }
            if (longest_match) {
                tokens.splice(i, longest_match.length, longest_match)
            }
            i += 1
        }
        return[ tokens, tokens.map(t => this.model.get(t))]
    }
}



