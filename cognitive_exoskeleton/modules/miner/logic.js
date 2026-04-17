// Simulated CPU-intensive task: Find the 10,000th prime number
function findPrime(n) {
    let count = 0;
    let num = 2;
    while (count < n) {
        let isPrime = true;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            count++;
        }
        num++;
    }
    return num - 1;
}

findPrime(10000); // Should return 104729
