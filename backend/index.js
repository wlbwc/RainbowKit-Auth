import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { SiweMessage, generateNonce } from "siwe";

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

const port = 8080;

app.get("/nonce", async (req, res) => {
    const nonce = generateNonce();
    res.status(200).json({ nonce });
});

app.get("/me", (req, res) => {
    const address = req.cookies.address;
    console.log(address);
    res.status(200).json({ address: address });
});

app.post("/verify", async (req, res) => {
    const { message, signature } = req.body;
    try {
        const siweMessage = new SiweMessage(message);
        const result = await siweMessage.verify({ signature });
        if (result.success) {
            const address = result.data.address;
            res.status(200).json({ ok: result.success, address: address });
        } else {
            res.status(500).json({ error: "Error occurred while verifying the signature" });
        }
    } catch (error) {
        console.log("error: ", error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie("address");
    res.status(200).json({ ok: true });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
