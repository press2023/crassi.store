const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Generate variations based on visual ambiguity
const variations = [];
const charsA = ['0', 'c', 'e']; // at index 5 "546ad[X]a22..."
const charsB = ['5', '6', 'e', 'c', 'a', '0']; // at index 45 "...777186[Y]ad018..."
const charsC = ['c', 'e']; // at index 56 "...09962e[Z]f83..."
const charsD = ['6', 'b']; // at index 2 "54[W]ad..."

for (const w of charsD) {
  for (const a of charsA) {
    for (const b of charsB) {
      for (const c of charsC) {
        let sec = `54${w}ad${a}a2225c0fe21a8fb381fbcfa2c777186${b}ad018536d09962e${c}f83ea54705`;
        variations.push(sec);
      }
    }
  }
}

console.log(`Testing ${variations.length} variations...`);

async function run() {
  for (const sec of variations) {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: 'https://538117e7cd43611bbbb8c4a017e94736.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'fd2d0f6354c376063fba364bf1a60bf2',
        secretAccessKey: sec
      }
    });
    try {
      await s3.send(new PutObjectCommand({
        Bucket: 'victorian',
        Key: 'test.html',
        Body: 'ok'
      }));
      console.log('\n\nSUCCESS!! Secret is:', sec);
      return;
    } catch(err) {
      if (err.name === 'SignatureDoesNotMatch' || err.name === 'Unauthorized') {
        process.stdout.write('.');
      } else {
        process.stdout.write('X');
      }
    }
  }
  console.log('\nAll failed.');
}
run();
