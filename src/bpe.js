import fs from 'node:fs'

function* pairwise(arr) {
   for (let i = 0; i < arr.length-1; i++) {
       yield arr[i]+"%"+arr[i+1]
   }
}
function frequencies (iter) {
    const map =new Map()
    for (const s of iter) {
        const frq = (map.get(s) ?? 0) + 1
        map.set(s, frq)
    }
    return map
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

class BPE {
    constructor( model_name, verbose=false,) {
        this.model_name=model_name
        this.verbose = verbose
        this.trained=false
        this.model= this._load_vocabulary()
    }
    _load_vocabulary() {
        if (fs.existsSync(this.weights_name)) {
            this.trained = true
            return new Map(JSON.parse(fs.readFileSync(this.weights_name, { encoding: 'utf8' })).entries())
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
        if(save) {
            fs.writeFileSync(this.model_name, JSON.stringify(Object.fromEntries(this.model)))
        }  
        return this.model
    }
    tokenize(_data){
        const tokens = [..._data.replaceAll("%", "")]
        console.log(this.model)
        let i = 0
        while (i < tokens.length) {
            let longest_match = null 
            for (const [k, v] of this.model.entries()) {
                console.log(k)
              if (tokens.slice(0, k.length).join("") == k) {
                 longest_match = k
              }
            }
            if (longest_match) {
                tokens.splice(i, longest_match.length, longest_match)
            }
            i += 1
        }
        return tokens
    }
}


const bpe = new BPE("abc.json")
//console.time('bpe')
//bpe.train(fs.readFileSync("out.txt", { encoding: 'utf8' }), true)
//console.timeEnd('bpe')
console.log(bpe.tokenize("Moby Dick"))


