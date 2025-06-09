#!/usr/bin/env python3
"""
Simple test to verify the fixes are working.
"""

import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_config_import():
    """Test that we can import the config function"""
    try:
        from app.config import get_project_folder
        print("✅ Config import successful")
        
        # Test workspace creation
        test_path = get_project_folder("test_project")
        print(f"✅ Workspace created at: {test_path}")
        return True
    except Exception as e:
        print(f"❌ Config import failed: {str(e)}")
        return False

def test_database_import():
    """Test that we can import and initialize the database"""
    try:
        from app.database import Database
        db = Database()
        print("✅ Database import and initialization successful")
        return True
    except Exception as e:
        print(f"❌ Database import failed: {str(e)}")
        return False

def test_agent_import():
    """Test that we can import the Manus agent"""
    try:
        from app.agent.manus import Manus
        print("✅ Manus agent import successful")
        return True
    except Exception as e:
        print(f"❌ Manus agent import failed: {str(e)}")
        return False

def main():
    """Run simple tests"""
    print("🚀 Running simple fix verification tests...\n")
    
    tests = [
        ("Config Import", test_config_import),
        ("Database Import", test_database_import),
        ("Agent Import", test_agent_import),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {str(e)}")
            results.append((test_name, False))
    
    print("\n📊 Test Results:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
    
    print("=" * 50)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 Basic imports are working correctly!")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
