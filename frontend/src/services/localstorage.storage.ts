export class LocalStorage {
    static read(key: string): any {
        const value = localStorage.getItem(key) || null
        try {
            if (value)
                return JSON.parse(value)
            return value
        } catch (e) {
            return value;
        }
    }
    static write(key: string, value: any) {
        if (typeof value === "string") {
            localStorage.setItem(key, value)
        } else {
            localStorage.setItem(key, JSON.stringify(value))
        }
    }
    static delete(key: string) {
        localStorage.removeItem(key);
    }
    static clear() {
        localStorage.clear();
    }
}

export default LocalStorage;