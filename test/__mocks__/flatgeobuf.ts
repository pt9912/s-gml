/**
 * Mock for flatgeobuf library
 */

export function serialize(_featureCollection: any): Uint8Array {
    // Create a mock FlatGeobuf binary with magic bytes
    const mockData = new Uint8Array([
        0x66, // 'f'
        0x67, // 'g'
        0x62, // 'b'
        0x03, // version
        ...new Array(100).fill(0), // Mock data
    ]);
    return mockData;
}
