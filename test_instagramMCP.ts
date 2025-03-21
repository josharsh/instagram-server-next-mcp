import { InstagramMcpServer } from './src/features/instagram/instagram.mcp';
import { McpError, ErrorCode } from './src/core/types/mcp';

async function testProfileSchemaValidation() {
  const server = new InstagramMcpServer();
  
  // Test valid profile request
  const validProfileRequest = {
    name: 'get_profile_data',
    arguments: {
      username: 'pinkinkcosmetictattoo',
      dataTypes: ['posts', 'stories'] as ('posts' | 'stories')[],
      limit: 10,
      includeMetadata: true,
      includeEngagement: true
    }
  };

  // Test invalid profile request (missing required fields)
  const invalidProfileRequest = {
    name: 'get_profile_data',
    arguments: {
      username: '',
      dataTypes: []
    }
  };

  try {
    // Test valid request
    const validResponse = await server['handleProfileData'](validProfileRequest.arguments);
    console.log('Valid profile request test passed');
    console.log(validResponse);

    // Test invalid request
    try {
      await server['handleProfileData'](invalidProfileRequest.arguments);
      console.error('Invalid profile request test failed - should have thrown error');
    } catch (error) {
      if (error instanceof McpError && error.code === ErrorCode.InvalidParams) {
        console.log('Invalid profile request test passed');
      } else {
        console.error('Invalid profile request test failed - wrong error type');
      }
    }
  } catch (error) {
    console.error('Profile schema validation tests failed:', error);
  }
}

async function testPostSchemaValidation() {
  const server = new InstagramMcpServer();
  
  // Test valid post request
  const validPostRequest = {
    name: 'get_post_data',
    arguments: {
      url: 'https://www.instagram.com/p/Cexample/',
      includeComments: true,
      includeLikers: true,
      includeMetadata: true
    }
  };

  // Test invalid post request (invalid URL)
  const invalidPostRequest = {
    name: 'get_post_data',
    arguments: {
      url: 'not-a-valid-url',
      includeComments: true
    }
  };

  try {
    // Test valid request
    const validResponse = await server['handlePostData'](validPostRequest.arguments);
    console.log('Valid post request test passed');
    console.log(validResponse);

    // Test invalid request
    try {
      await server['handlePostData'](invalidPostRequest.arguments);
      console.error('Invalid post request test failed - should have thrown error');
    } catch (error) {
      if (error instanceof McpError && error.code === ErrorCode.InvalidParams) {
        console.log('Invalid post request test passed');
      } else {
        console.error('Invalid post request test failed - wrong error type');
      }
    }
  } catch (error) {
    console.error('Post schema validation tests failed:', error);
  }
}

async function main() {
  await testProfileSchemaValidation();
  await testPostSchemaValidation();
}

main().catch(console.error);
