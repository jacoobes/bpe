export function frequencies (iter) {
    const map =new Map()
    for (const s of iter) {
        const frq = (map.get(s) ?? 0) + 1
        map.set(s, frq)
    }
    return map
}
