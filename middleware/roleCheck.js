function roleCheck(...roles) {
    return function roleCheckMiddleware(req, res, next) {
        try {
            console.log(req.user, ...roles)
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'You are not authorized to delete this post!' })
            }
        } catch (error) {
            res.status(500).send(`Error: Error at role check middleware: ${error.message}`);
        }

        next()
    }
};

export default roleCheck;