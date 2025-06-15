const users = [
    {
        id: 1,
        email: "aaaaaa@aaaaaa.aaaaaa",
        password: "aaaaaa",
        user_name: "aaaaaa",
    },
    {
        id: 2,
        email: "bbbbbb@bbbbbb.bbbbbb",
        password: "bbbbbb",
        user_name: "bbbbbb",
    },
    {
        id: 3,
        email: "cccccc@cccccc.cccccc",
        password: "cccccc",
        user_name: "cccccc",
    },
]; // В реальном приложении используйте базу данных

export class User {
    static async create({ email, password }) {
        const user = { id: users.length + 1, email, password };
        users.push(user);
        return user;
    }

    static async findByEmail(email) {
        return users.find((user) => user.email === email);
    }

    static async findById(id) {
        return users.find((user) => user.id === id);
    }
}
