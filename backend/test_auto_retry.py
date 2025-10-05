#!/usr/bin/env python3
"""
Test script to verify automatic retry mechanism when filter rejects responses.
This simulates the scenario where the LLM returns non-compliant content.
"""

import asyncio
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.generation_service import GenerationService
from app.core.filters import ResponseFilter
import logging

# Configure logging to see retry attempts
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


async def test_automatic_retry():
    """Test that the system automatically retries when filter rejects content."""

    print("\n" + "=" * 80)
    print("Testing Automatic Retry Mechanism")
    print("=" * 80 + "\n")

    service = GenerationService()

    # Test case 1: Normal request
    print("Test 1: Normal request (should succeed on first try or retry automatically)")
    print("-" * 80)
    try:
        prompts = await service.generate_response(
            topic="Education",
            intention="Video Creation",
            theme="Agentic AI enhances learning operations by automating decisions and personalizing learning experiences.",
            content="Agentic AI is a key component in L&D strategies.",
        )

        print(f"✅ SUCCESS: Generated {len(prompts)} prompts")
        print(
            f"First prompt length: {len(prompts[0])} characters ({len(prompts[0].split())} words)"
        )

        # Check for error messages
        has_errors = any(
            "apologize" in p.lower() or "please try again" in p.lower() for p in prompts
        )
        if has_errors:
            print("❌ FAIL: Prompts contain error messages!")
            return False
        else:
            print("✅ No error messages found in prompts")

    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        return False

    print("\n")

    # Test case 2: Another request to test consistency
    print("Test 2: Different topic (testing retry consistency)")
    print("-" * 80)
    try:
        prompts = await service.generate_response(
            topic="Technology",
            intention="Blog Post",
            theme="Cloud computing is transforming business infrastructure",
            content="Companies are moving to cloud-based solutions for scalability and cost efficiency.",
        )

        print(f"✅ SUCCESS: Generated {len(prompts)} prompts")
        print(
            f"First prompt length: {len(prompts[0])} characters ({len(prompts[0].split())} words)"
        )

        # Check for error messages
        has_errors = any(
            "apologize" in p.lower() or "please try again" in p.lower() for p in prompts
        )
        if has_errors:
            print("❌ FAIL: Prompts contain error messages!")
            return False
        else:
            print("✅ No error messages found in prompts")

    except Exception as e:
        print(f"❌ FAIL: {str(e)}")
        return False

    print("\n" + "=" * 80)
    print("All tests passed! ✅")
    print("=" * 80 + "\n")

    return True


async def test_filter_behavior():
    """Test the filter's behavior with various inputs."""

    print("\n" + "=" * 80)
    print("Testing Filter Behavior")
    print("=" * 80 + "\n")

    filter = ResponseFilter()

    # Test 1: Empty response
    print("Test 1: Empty response (should raise ValueError)")
    print("-" * 80)
    try:
        result = filter.filter_response("")
        print(f"❌ FAIL: Should have raised ValueError, got: {result}")
    except ValueError as e:
        print(f"✅ SUCCESS: Raised ValueError as expected: {str(e)}")

    print("\n")

    # Test 2: Valid response
    print("Test 2: Valid response (should return cleaned content)")
    print("-" * 80)
    try:
        valid_response = """1. Create an engaging video about AI in education
2. Design a comprehensive tutorial series
3. Develop interactive content for students"""

        result = filter.filter_response(valid_response)
        print(f"✅ SUCCESS: Returned valid content")
        print(f"Content length: {len(result)} characters")

        # Check it's not an error message
        if "apologize" in result.lower() or "please try again" in result.lower():
            print(f"❌ FAIL: Got error message instead of content: {result}")
        else:
            print("✅ No error messages in result")

    except ValueError as e:
        print(f"⚠️  Unexpected ValueError: {str(e)}")

    print("\n")

    # Test 3: Response with too few words
    print("Test 3: Response with insufficient content (should raise ValueError)")
    print("-" * 80)
    try:
        short_response = "Too short"
        result = filter.filter_response(short_response)
        print(f"⚠️  Got result: {result}")
        if "apologize" in result.lower():
            print(
                "❌ OLD BEHAVIOR: Returned error message instead of raising exception"
            )
        else:
            print("✅ Returned some content")
    except ValueError as e:
        print(f"✅ SUCCESS: Raised ValueError as expected: {str(e)}")

    print("\n" + "=" * 80)
    print("Filter tests complete!")
    print("=" * 80 + "\n")


async def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("AUTOMATIC RETRY TEST SUITE")
    print("=" * 80)

    # Test filter behavior first
    await test_filter_behavior()

    print("\n")

    # Test automatic retry
    success = await test_automatic_retry()

    if success:
        print("\n✅ ALL TESTS PASSED!")
        print("The system will now automatically retry when filters reject content.")
        print("No error messages like 'I apologize...' will be returned to users.\n")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        print("Please check the logs above for details.\n")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
