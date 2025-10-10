import 'dotenv/config';
import { Oracle } from './src/lib/oracle';

function main() {
    console.log("Initializing oracle...");
    try {
        const oracle = new Oracle();
        oracle.startPolling();
    } catch (error) {
        console.error("Failed to start oracle:", error);
        process.exit(1);
    }
}

main();
