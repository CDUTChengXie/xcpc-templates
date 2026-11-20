# Nim具体取法与反Nim

每步只能选一堆取走正数；堆大小为 u64；反 Nim 中空局面当前玩家已获胜。 Move={堆下标,取走数量}，下标 ∈ [0,piles.size())；无必胜取法返回 nullopt。

时间 O(n)，额外空间 O(1)。

```cpp
namespace NimMoves {
    using Move = std::pair<int, u64>;
    // 返回当前玩家是否必胜；misere=true 表示取完者输
    bool winning(const std::vector<u64> &a, bool misere = false) {
        u64 x = 0;
        size_t ones = 0, big = 0;
        for (u64 v : a) {
            x ^= v;
            ones += v == 1;
            big += v > 1;
        }
        return misere && big == 0 ? ones % 2 == 0 : x != 0;
    }
    // 返回一项必胜操作：堆下标和取走数量；不修改 a
    std::optional<Move> move(const std::vector<u64> &a, bool misere = false) {
        if (!winning(a, misere))
            return std::nullopt;
        u64 x = 0;
        size_t ones = 0, big = 0;
        int last = -1;
        for (int i = 0; i < int(a.size()); ++i) {
            x ^= a[i];
            ones += a[i] == 1;
            if (a[i] > 1) {
                ++big;
                last = i;
            }
        }
        if (misere && big == 1)
            return Move{last, a[last] - (ones % 2 == 0 ? 1 : 0)};
        if (misere && big == 0) {
            for (int i = 0; i < int(a.size()); ++i)
                if (a[i])
                    return Move{i, 1};
            return std::nullopt;
        }
        for (int i = 0; i < int(a.size()); ++i)
            if ((a[i] ^ x) < a[i])
                return Move{i, a[i] - (a[i] ^ x)};
        return std::nullopt;
    }
}
```
