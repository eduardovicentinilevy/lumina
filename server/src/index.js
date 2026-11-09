require("dotenv/config");
const app = require("./app");

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Lumina API a correr em http://localhost:${PORT}`);
});
