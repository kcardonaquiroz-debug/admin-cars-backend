const analisisService = require("../services/analisisService");

const getAnalisis = async (req, res) => {
    try {
        const data = await analisisService.obtenerAnalisis();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAnalisis };
