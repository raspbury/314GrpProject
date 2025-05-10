import { ShortlistEntity } from '../../../entities/ShortlistEntity.js';
import pool from '../../../db.js';

export class DeleteShortlistController {
    shortlistEntity;

    constructor() {
        this.shortlistEntity = new ShortlistEntity(pool);
    }

    deleteShortlistEntry = async (req, res) => {
        const { homeownerUsername, serviceId } = req.params;

        if (!homeownerUsername || !serviceId) {
            return res.status(400).json({ 
                message: 'Both homeowner username and service ID are required' 
            });
        }

        try {
            await this.shortlistEntity.deleteShortlistEntry(homeownerUsername, serviceId);
            res.status(200).json({ 
                message: 'Service removed from shortlist successfully' 
            });
        } catch (error) {
            console.error('Error deleting shortlist entry:', error);
            res.status(500).json({ 
                message: 'Failed to remove service from shortlist' 
            });
        }
    };
}