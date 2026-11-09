
const request = require("supertest");
const app = require("../app");

describe("FixNear API", () => {
  test("GET / should return successful API response", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "FIXNEAR API is running",
    });
  });

  test("Unknown API route should return 404", async () => {
    const response = await request(app).get("/api/unknown-test-route");

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("API endpoint not found.");
  });
});
