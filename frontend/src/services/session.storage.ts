export class SessionStorage {
    static read(key: string): any {
        const value = sessionStorage.getItem(key) || null
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
            sessionStorage.setItem(key, value)
        } else {
            sessionStorage.setItem(key, JSON.stringify(value))
        }
    }
    static delete(key: string) {
        sessionStorage.removeItem(key);
    }
    static clear() {
        sessionStorage.clear();
    }
}

export default SessionStorage;