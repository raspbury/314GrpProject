/**
 *  Manages the shortlist of a homeowner user.
 *  This class handles creating, reading, and searching for shortlist entries in the database,
 *  interacting directly with the Shortlist table.
 */
export class ShortlistEntity {
  /** @type {import('mysql2/promise').Pool} */
  dbPool;

  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  /**
   * Creates a new shortlist entry in the database.
   * @param {number} serviceId - The ID of the service to be shortlisted.
   * @param {string} homeownerUsername - The username of the homeowner who is creating the shortlist.
   * @returns {Promise<boolean>} True if the shortlist was created successfully, false otherwise.
   */
  async createShortlist(serviceId, homeownerUsername) {
    const sql = `
        INSERT INTO Shortlist (serviceID, homeownerUsername)
        VALUES (?, ?)
    `;
    let connection;
    try {
      connection = await this.dbPool.getConnection();
      const [result] = await connection.query(sql, [
        serviceId,
        homeownerUsername,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Database error during shortlist creation:", error);
      throw new Error("Database error during shortlist creation.");
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Checks if a specific service is shortlisted by a specific homeowner.
   * This method is intended for ReadShortlistController.
   * @param {string} homeOwnerUsername - The username of the homeowner.
   * @param {number} serviceId - The ID of the service.
   * @returns {Promise<boolean>} True if the record exists, false otherwise.
   */
  async getShortlistEntry(homeOwnerUsername, serviceId) {
    const sql = `
        SELECT 1
        FROM Shortlist
        WHERE homeOwnerUsername = ?
          AND serviceID = ?
    `;
    try {
      const [rows] = await this.dbPool.query(sql, [
        homeOwnerUsername,
        serviceId,
      ]);
      return rows.length > 0;
    } catch (error) {
      console.error("Database error while checking shortlist entry:", error);
      throw new Error("Database error while checking shortlist entry.");
    }
  }

  /**
   * Searches for shortlisted service IDs based on various criteria related to the service itself.
   * This method is intended for SearchShortlistController.
   * Filters include homeowner's username (mandatory for the shortlist),
   * and optional filters on service details like cleaner's username, description, and price.
   * Only active services are considered in the search.
   * @param {object} searchParams - The search criteria.
   * @param {string} searchParams.homeownerUsername - The username of the homeowner (mandatory).
   * @param {string} [searchParams.cleanerUsername] - Partial match for the service's cleaner username.
   * @param {string} [searchParams.description] - Partial match for the service's description.
   * @param {number} [searchParams.minPrice] - Minimum price per hour of the service.
   * @param {number} [searchParams.maxPrice] - Maximum price per hour of the service.
   * @returns {Promise<object[]>} An array of objects containing service details that match the criteria.
   */
  async searchShortlistedServices(searchParams) {
    const {
      homeownerUsername,
      cleanerUsername,
      description,
      minPrice,
      maxPrice,
    } = searchParams;

    let sql = `
        SELECT s.serviceID, s.cleanerUsername, s.description, s.pricePerHour, 
               sc.name as categoryName
        FROM Shortlist sl
        JOIN Service s ON sl.serviceID = s.serviceID
        JOIN ServiceCategory sc ON s.categoryID = sc.id
        WHERE sl.homeOwnerUsername = ? AND s.isActive = TRUE
    `;
    const params = [homeownerUsername];

    if (cleanerUsername) {
      sql += " AND s.cleanerUsername LIKE ?";
      params.push(`%${cleanerUsername}%`);
    }
    if (description) {
      sql += " AND s.description LIKE ?";
      params.push(`%${description}%`);
    }
    if (minPrice !== undefined && minPrice !== null) {
      sql += " AND s.pricePerHour >= ?";
      params.push(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      sql += " AND s.pricePerHour <= ?";
      params.push(maxPrice);
    }
    sql += " ORDER BY s.serviceID ASC"; // Or any other relevant ordering

    try {
      const [rows] = await this.dbPool.query(sql, params);
      return rows.map((row) => ({
        serviceId: row.serviceID,
        cleanerUsername: row.cleanerUsername,
        description: row.description,
        pricePerHour: parseFloat(row.pricePerHour),
        categoryName: row.categoryName,
      }));
    } catch (error) {
      console.error(
        "Database error during shortlisted services search:",
        error
      );
      throw new Error("Database error during shortlisted services search.");
    }
  }

  /**
   * Deletes a specific shortlist entry from the database.
   * @param {string} homeownerUsername - The username of the homeowner.
   * @param {number} serviceId - The ID of the service.
   * @returns {Promise<boolean>} True if the entry was deleted successfully, throws an error otherwise.
   */
  async deleteShortlistEntry(homeownerUsername, serviceId) {
    const sql = `
        DELETE FROM Shortlist 
        WHERE homeownerUsername = ? AND serviceID = ?
    `;

    try {
      const [result] = await this.dbPool.query(sql, [
        homeownerUsername,
        serviceId,
      ]);
      if (result.affectedRows === 0) {
        throw new Error("Shortlist entry not found");
      }
      return true;
    } catch (error) {
      console.error("Error deleting shortlist entry:", error);
      throw error;
    }
  }
}
