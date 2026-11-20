# 物品装箱FirstFit与BestFit

容量 cap>=0，各物品重量在 [0,cap]。 箱号 [0,remaining.size())；每件不可拆；First Fit 选最早能装的箱，Best Fit 选能装且剩余最少的箱（平局取较早）。 两者只执行指定策略，不保证全局最少箱；输入不改，空输入返回两个空数组，非法重量/容量抛 invalid_argument。

两种策略均 O(n log n) 时间、O(n) 空间。

```cpp
namespace BinPacking {
    // 装箱结果：每件物品的箱号与各箱剩余容量。
    struct Result {
        std::vector<int> assignment; // assignment[i] 为第 i 件输入物品所在的箱号，从 0 编号
        std::vector<i64> remaining;  // remaining[box] 为箱 box 最终剩余的容量
    };
    // 检查重量与容量，非法输入抛 invalid_argument
    void validate(const std::vector<i64> &a, i64 cap) {
        if (cap < 0)
            throw std::invalid_argument("capacity");
        for (i64 x : a)
            if (x < 0 || x > cap)
                throw std::invalid_argument("weight");
    }
    // 返回 First Fit 的完整分配，原始物品顺序不变
    Result firstFit(const std::vector<i64> &a, i64 cap) {
        validate(a, cap);
        Result result;
        if (a.empty())
            return result;
        int size = 1;
        while (size < int(a.size()))
            size *= 2;
        std::vector<i64> tree(2 * size, cap);
        for (i64 x : a) {
            int u = 1;
            while (u < size)
                u = tree[u * 2] >= x ? u * 2 : u * 2 + 1;
            int id = u - size;
            if (id == int(result.remaining.size()))
                result.remaining.push_back(cap);
            assert(id < int(result.remaining.size()));
            result.assignment.push_back(id);
            result.remaining[id] -= x;
            tree[u] = result.remaining[id];
            while (u > 1) {
                u /= 2;
                tree[u] = std::max(tree[u * 2], tree[u * 2 + 1]);
            }
        }
        return result;
    }
    // 返回 Best Fit 的完整分配；剩余容量相同优先使用较早箱子
    Result bestFit(const std::vector<i64> &a, i64 cap) {
        validate(a, cap);
        Result result;
        std::set<std::pair<i64, int>> boxes;
        for (i64 x : a) {
            auto it = boxes.lower_bound({x, -1});
            int id;
            if (it == boxes.end()) {
                id = result.remaining.size();
                result.remaining.push_back(cap);
            } else {
                id = it->second;
                boxes.erase(it);
            }
            result.assignment.push_back(id);
            result.remaining[id] -= x;
            boxes.emplace(result.remaining[id], id);
        }
        return result;
    }
}
```
