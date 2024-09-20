import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { frequencies } from './shared.js'
import { fileURLToPath } from 'url'


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
    train(_corpus, save = false, k = 500) {
        if(typeof(_corpus) != 'string') {
            throw Error("Cannot train nonstring")
        }
        let tokens = [..._corpus.replaceAll("%", "")]
        tokens.forEach(tok => {
            if(!this.model.has(tok)) {
                this.model.set(tok, this.model.size+1)
            }
        })
        let i = 0 

        while(i < k) {
            const pairedtokens = pairwise(tokens)
            const pairFreqs = Array.from(frequencies(pairedtokens).entries())

            pairFreqs.sort(([, v0], [, v1]) => v1 - v0)
            if(!pairFreqs.length) {
                break
            }
            const [best, freq] = pairFreqs[0]
            if (freq == 1) {
                break
            }
            const [lhs, rhs] = best.split("%")
            const decodedPair = lhs+rhs
            tokens = merge(tokens, decodedPair)
            this.model.set(decodedPair, this.model.size+1)
            i++
        }
        this.model.set("<UNK>", this.model.size+1)
        if(save) {
            writeFileSync(this.model_name, JSON.stringify(Object.fromEntries(this.model), null, 4))
        }  
        return this.model
    }
    tokenize(_data){
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


if (import.meta.url.startsWith('file:')) { // (A)

  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) { 
        const bpe = new BPE("wc.json")
        console.time('bpe')
        //bpe.train(readFileSync("moby.txt", { encoding: 'utf8' }), true, 5000)
        bpe.train("How much wood could a woodchuck chuck?", true, 5000)
        console.timeEnd('bpe')
  }
}

