# 恰好 k 段最大元素和（WQS 二分）

要选恰好 `k` 个非空、不重叠的连续段，让总和最大。朴素 DP 要记「选了几段」。改个问法：每开一段都扣 `p` 分，先不限制段数，最优方案会自己选几段？从左到右扫，每个元素要么延长上一段，要么从此前最优方案新开一段；不以它结尾的方案仍可保留。

罚分越高，最优段数越少。同分时取段数更多的方案，二分找仍能选到至少 `k` 段的最大整数罚分。在这个模型中，多一段带来的最优收益不增，因此临界罚分下即使段数跳过 `k`，恰好 `k` 段也同为最优。用扣分后的最优值加回 `p*k` 就是原答案；别把这一步直接套到任意计数约束上。

`WQS::maxKSubarrays(a, k)`；0<=k<=n，段可相邻。每项绝对值 < 2^55，B=1+绝对值总和 < 2^56，且 B×(n+1) < 2^59。

O(n log(1+绝对值总和))，空间 O(1)。

```cpp
namespace WQS {
    struct State {
        i64 value;
        int count;
    };
    // value 为扣除罚分后的最优值，并列时优先选更多段
    inline State better(State a, State b) {
        return a.value > b.value || (a.value == b.value && a.count >= b.count) ? a : b;
    }
    // 每开启一段扣 penalty；返回 {扣分后的最大和, 选用段数}
    inline State evaluate(const std::vector<i64> &a, i64 penalty) {
        constexpr i64 LOW = -(1LL << 60);
        State outside{0, 0}, inside{LOW, 0};
        for (i64 x : a) {
            State begin{outside.value + x - penalty, outside.count + 1};
            State extend = inside.value == LOW ? inside : State{inside.value + x, inside.count};
            inside = better(begin, extend);
            outside = better(outside, inside);
        }
        return outside;
    }
    // 选恰好 k 个不重叠、非空连续段；返回这些段的最大元素和
    inline i64 maxKSubarrays(const std::vector<i64> &a, int k) {
        assert(k >= 0 && k <= int(a.size()));
        if (k == 0)
            return 0;
        i64 bound = 1;
        for (i64 x : a) {
            assert(x > -(1LL << 55) && x < (1LL << 55));
            bound += std::abs(x);
            assert(bound < (1LL << 56));
        }
        assert(__int128(bound) * (a.size() + 1) < (1LL << 59));
        i64 low = -bound, high = bound;
        while (low < high) {
            i64 mid = low + (high - low + 1) / 2;
            if (evaluate(a, mid).count >= k)
                low = mid;
            else
                high = mid - 1;
        }
        return evaluate(a, low).value + low * k;
    }
}
```
