export const config = {
  jwtSecret: (process.env.JWT_SECRET as string) || "My_Secret_Key",
  port: process.env.PORT || 4000,
  emailHost: process.env.EMAIL_HOST || "smtp.gmail.com",
  emailPort: parseInt(process.env.EMAIL_PORT || "587"),
  emailUser: process.env.EMAIL_USER || "",
  emailPassword: process.env.EMAIL_PASSWORD || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4200",
  roles: {
    admin: 1,
    curador: 2,
    investigador: 3,
    visitante: 4,
  },
};

export default config;
