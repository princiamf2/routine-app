const { randomBytes, scrypt, timingSafeEqual, } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);

const SCRYPT_OPTIONS = {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
};

const KEY_LENGTH = 64;
const HASH_PATTERN = /^scrypt-v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

function isValidPassword(password) {
    if (typeof password !== "string" || password.length > 256)
        return false;
    const length = Array.from(password).length;
    return (
        length >= 8 &&
        length <= 128 &&
        /\p{Lu}/u.test(password) &&
        /[0-9]/.test(password) &&
        /[^\p{L}\p{N}\s]/u.test(password)
    );
}

async function hashPassword(password) {
    if (!isValidPassword(password))
        throw new Error("Le mot de passe doit contenir entre 8 et 128 caractères, une majuscule, un chiffre et un caractère spécial.");
    const salt = randomBytes(16);
    const derivedKey = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
    return `scrypt-v1$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
    if (!isValidPassword(password) || typeof storedHash !== "string")
        return false;

    const match = HASH_PATTERN.exec(storedHash);
    if (!match)
        return false;
    const salt = Buffer.from(match[1], "hex");
    const expectedKey = Buffer.from(match[2], "hex");
    const actualKey = await scryptAsync(
        password,
        salt,
        KEY_LENGTH,
        SCRYPT_OPTIONS
    );
    return timingSafeEqual(actualKey, expectedKey);
}

module.exports = {
    isValidPassword,
    hashPassword,
    verifyPassword,
};