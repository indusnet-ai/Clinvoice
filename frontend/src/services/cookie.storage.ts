export class CookieStorage {
    static read(key: string): any {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=')
            return parts[0] === key ? decodeURIComponent(parts[1]) : r
        }, '')
    }
    static write(key: string, value: any, days: number = 1, path = '/', _httpOnly=false) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString()
        document.cookie = key + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path
    }
    static delete(key: string, path: string = '/') {
        this.write(key, '', -1, path)
    }
    static clear(path: string = '/') {
        document.cookie.split('; ').forEach((x: any) => {
            const key = x.split('=')[0];
            this.write(key, '', -1, path)
        })
    }
}

export default CookieStorage;

