# 巴什阶梯与Lasker博弈

巴什 n>=0、1<=low<=high，每步取 [low,high]；阶梯每步选一级往下一级移动正数；Lasker 每步减一堆或拆成两个非空堆，heap<ULLONG_MAX。 阶梯 a[0] 是第 1 级（地面不入数组）；Move={数组下标,移动数量}；石子非负；不能行动者输。

巴什和 Lasker O(1)，阶梯 O(n)。

```cpp
namespace SmallGames {
    // 返回巴什必胜取数；参数需满足 n>=0、1<=low<=high
    std::optional<i64> bashMove(i64 n, i64 low, i64 high) {
        if (n < 0 || low < 1 || high < low)
            throw std::invalid_argument("bash");
        i128 r = i128(n) % (i128(low) + high);
        if (r < low)
            return std::nullopt;
        return i64(std::min(r, i128(high)));
    }
    // 返回阶梯 SG；数组下标 0、2、4 对应第 1、3、5 级
    u64 stairSG(const std::vector<u64> &a) {
        u64 x = 0;
        for (size_t i = 0; i < a.size(); i += 2)
            x ^= a[i];
        return x;
    }
    // 返回把 a[i] 的 t 个石子向下移一级的必胜操作；i=0 时直接移到地面
    std::optional<std::pair<int, u64>> stairMove(const std::vector<u64> &a) {
        u64 x = stairSG(a);
        for (int i = 0; i < int(a.size()); i += 2)
            if ((a[i] ^ x) < a[i])
                return std::pair{i, a[i] - (a[i] ^ x)};
        return std::nullopt;
    }
    // 返回 Lasker 单堆 SG；heap 不得为 ULLONG_MAX（该值的 SG 超出 u64）
    u64 laskerSG(u64 heap) {
        if (heap == ULLONG_MAX)
            throw std::out_of_range("sg");
        return heap == 0 ? 0 : heap % 4 == 0 ? heap - 1 : heap % 4 == 3 ? heap + 1 : heap;
    }
}
```
